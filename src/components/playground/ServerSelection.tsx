interface ServerSelectProps {
  serverInfo: Array<{ name: string; description: string; url: string }>;
  selectedServerInfo: { name: string; description: string; url: string };
  handleServerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const ServerSelect: React.FC<ServerSelectProps> = ({
  serverInfo,
  selectedServerInfo,
  handleServerChange,
}) => {
  return (
    <div className="text-right mt-4">
      <select
        className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-sm"
        value={selectedServerInfo.url}
        onChange={handleServerChange}
      >
        {serverInfo.map((server) => (
          <option key={server.name} value={server.url}>
            {server.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ServerSelect;
